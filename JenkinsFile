pipeline {
    /*
     * The Jenkins agent only needs:
     *   - Java, to connect to the Jenkins controller
     *   - Git, to check out the repository
     *   - Docker Engine / Docker CLI
     *   - Docker Compose plugin
     *
     * Node.js, npm, Python and pip are provided by the Dockerfiles.
     */
    agent {
        label 'linux && docker'
    }

    options {
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
        timestamps()
        timeout(time: 35, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '15'))
    }

    triggers {
        githubPush()
    }

    parameters {
        string(
            name: 'API_BASE_URL',
            defaultValue: 'http://localhost:4000',
            description: 'Public API URL compiled into the Angular bundle'
        )
    }

    environment {
        // Docker Hub repositories under the mehdibenzaied namespace.
        FRONTEND_IMAGE = 'mehdibenzaied/devops-mastering-frontend'
        BACKEND_IMAGE  = 'mehdibenzaied/devops-mastering-backend'

        // Jenkins username/password credential used for Docker Hub.
        REGISTRY_CREDENTIALS = 'DockerHub'

        // The Compose file must use ${FRONTEND_REF} and ${BACKEND_REF}.
        COMPOSE_FILE = 'compose.yaml'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm

                script {
                    env.SHORT_SHA = sh(
                        script: 'git rev-parse --short=8 HEAD',
                        returnStdout: true
                    ).trim()

                    env.SAFE_BRANCH = (env.BRANCH_NAME ?: 'local')
                        .replaceAll('[^A-Za-z0-9_.-]', '-')

                    env.IMAGE_TAG = "${env.SAFE_BRANCH}-${env.SHORT_SHA}-${env.BUILD_NUMBER}"
                    env.FRONTEND_REF = "${env.FRONTEND_IMAGE}:${env.IMAGE_TAG}"
                    env.BACKEND_REF = "${env.BACKEND_IMAGE}:${env.IMAGE_TAG}"
                    env.CI_PROJECT = "devops-mastering-ci-${env.BUILD_NUMBER}"
                }

                echo "Frontend image: ${env.FRONTEND_REF}"
                echo "Backend image:  ${env.BACKEND_REF}"
            }
        }

        stage('Validate Compose') {
            steps {
                sh '''
                    export FRONTEND_REF BACKEND_REF
                    docker compose --file "$COMPOSE_FILE" config --quiet
                '''
            }
        }

        stage('Build Images') {
            parallel {
                stage('Build Frontend') {
                    steps {
                        sh '''
                            docker build \
                              --pull \
                              --target runtime \
                              --build-arg API_BASE_URL="$API_BASE_URL" \
                              --file frontend/Dockerfile \
                              --tag "$FRONTEND_REF" \
                              frontend
                        '''
                    }
                }

                stage('Build Backend') {
                    steps {
                        sh '''
                            docker build \
                              --pull \
                              --target runtime \
                              --file backend/Dockerfile \
                              --tag "$BACKEND_REF" \
                              backend
                        '''
                    }
                }
            }
        }

        /*
         * This validates that the complete stack starts successfully.
         * Docker Compose waits for the HEALTHCHECK instructions contained
         * in the frontend and backend images, plus any database healthcheck
         * declared in compose.yaml.
         *
         * This is a startup/integration check, not a replacement for unit tests.
         */
        stage('Compose Integration Test') {
            steps {
                sh '''
                    export FRONTEND_REF BACKEND_REF

                    docker compose \
                      --project-name "$CI_PROJECT" \
                      --file "$COMPOSE_FILE" \
                      up --detach --wait --no-build

                    docker compose \
                      --project-name "$CI_PROJECT" \
                      --file "$COMPOSE_FILE" \
                      ps
                '''
            }

            post {
                unsuccessful {
                    sh '''
                        export FRONTEND_REF BACKEND_REF

                        docker compose \
                          --project-name "${CI_PROJECT:-devops-mastering-ci-$BUILD_NUMBER}" \
                          --file "$COMPOSE_FILE" \
                          logs --no-color || true
                    '''
                }

                always {
                    sh '''
                        export FRONTEND_REF BACKEND_REF

                        docker compose \
                          --project-name "${CI_PROJECT:-devops-mastering-ci-$BUILD_NUMBER}" \
                          --file "$COMPOSE_FILE" \
                          down --volumes --remove-orphans || true
                    '''
                }
            }
        }

        stage('Publish Images') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }

            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: env.REGISTRY_CREDENTIALS,
                        usernameVariable: 'REGISTRY_USER',
                        passwordVariable: 'REGISTRY_PASSWORD'
                    )
                ]) {
                    sh '''
                        set +x

                        echo "$REGISTRY_PASSWORD" |
                          docker login \
                            --username "$REGISTRY_USER" \
                            --password-stdin

                        # Immutable tags identify the exact Jenkins build.
                        docker push "$FRONTEND_REF"
                        docker push "$BACKEND_REF"

                        # Mutable branch tags point to the latest validated build.
                        docker tag "$FRONTEND_REF" "$FRONTEND_IMAGE:$SAFE_BRANCH-latest"
                        docker tag "$BACKEND_REF"  "$BACKEND_IMAGE:$SAFE_BRANCH-latest"

                        docker push "$FRONTEND_IMAGE:$SAFE_BRANCH-latest"
                        docker push "$BACKEND_IMAGE:$SAFE_BRANCH-latest"

                        # The global latest tag is moved only by the main branch.
                        if [ "$BRANCH_NAME" = "main" ]; then
                          docker tag "$FRONTEND_REF" "$FRONTEND_IMAGE:latest"
                          docker tag "$BACKEND_REF"  "$BACKEND_IMAGE:latest"

                          docker push "$FRONTEND_IMAGE:latest"
                          docker push "$BACKEND_IMAGE:latest"
                        fi
                    '''
                }
            }
        }

        /*
         * Learning deployment: the production Compose project runs on the
         * same Docker agent as Jenkins. In a real company, deployment would
         * normally target a dedicated server or orchestration platform.
         */
        stage('Deploy with Compose') {
            when {
                branch 'main'
            }

            input {
                message "Deploy ${env.IMAGE_TAG}?"
                ok 'Deploy'
            }

            steps {
                sh '''
                    export FRONTEND_REF BACKEND_REF

                    docker compose \
                      --project-name devops-mastering-prod \
                      --file "$COMPOSE_FILE" \
                      up --detach --wait --no-build

                    docker compose \
                      --project-name devops-mastering-prod \
                      --file "$COMPOSE_FILE" \
                      ps
                '''
            }
        }
    }

    post {
        success {
            script {
                if (env.BRANCH_NAME == 'main') {
                    echo "Build, validation, publication and deployment succeeded: ${env.IMAGE_TAG}"
                } else if (env.BRANCH_NAME == 'develop') {
                    echo "Build, validation and publication succeeded: ${env.IMAGE_TAG}"
                } else {
                    echo "Build and validation succeeded: ${env.IMAGE_TAG}"
                }
            }
        }

        failure {
            echo 'Pipeline failed. Check the failed stage logs.'
        }

        always {
            sh '''
                docker logout 2>/dev/null || true
                docker image rm "$FRONTEND_REF" 2>/dev/null || true
                docker image rm "$BACKEND_REF" 2>/dev/null || true
            '''
            cleanWs()
        }
    }
}
