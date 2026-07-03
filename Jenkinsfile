pipeline {
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

    parameters {
        string(
            name: 'API_BASE_URL',
            defaultValue: 'http://localhost:4000',
            description: 'Public API URL compiled into the Angular frontend image'
        )
    }

    environment {
        FRONTEND_IMAGE = 'mehdibenzaied/hr-portal-frontend'
        BACKEND_IMAGE = 'mehdibenzaied/hr-portal-backend'
        REGISTRY_CREDENTIALS = 'DockerHub'
        COMPOSE_FILE = 'docker-compose.yml'
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

                    /*
                     * A normal Pipeline-from-SCM job does not always expose
                     * BRANCH_NAME or GIT_BRANCH. The GitSCM branch configured
                     * on the Jenkins job is therefore used as a fallback.
                     */
                    def configuredBranch = scm.branches[0].name
                    def rawBranch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: configuredBranch ?: 'local'

                    rawBranch = rawBranch
                        .replaceFirst(/^\*\//, '')
                        .replaceFirst(/^origin\//, '')

                    env.SOURCE_BRANCH = rawBranch
                    env.SAFE_BRANCH = rawBranch.replaceAll('[^A-Za-z0-9_.-]', '-')
                    env.IMAGE_TAG = "${env.SAFE_BRANCH}-${env.SHORT_SHA}-${env.BUILD_NUMBER}"

                    env.FRONTEND_REF = "${env.FRONTEND_IMAGE}:${env.IMAGE_TAG}"
                    env.BACKEND_REF = "${env.BACKEND_IMAGE}:${env.IMAGE_TAG}"
                    env.CI_PROJECT = "hr-portal-ci-${env.BUILD_NUMBER}"
                }

                echo "Branch:         ${env.SOURCE_BRANCH}"
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

        stage('Compose Integration Test') {
            steps {
                sh '''
                    export FRONTEND_REF BACKEND_REF
                    export DB_HOST_PORT=0
                    export BACKEND_HOST_PORT=0
                    export FRONTEND_HOST_PORT=0

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
                        export DB_HOST_PORT=0
                        export BACKEND_HOST_PORT=0
                        export FRONTEND_HOST_PORT=0

                        docker compose \
                          --project-name "${CI_PROJECT:-hr-portal-ci-$BUILD_NUMBER}" \
                          --file "$COMPOSE_FILE" \
                          logs --no-color || true
                    '''
                }

                always {
                    sh '''
                        export FRONTEND_REF BACKEND_REF
                        export DB_HOST_PORT=0
                        export BACKEND_HOST_PORT=0
                        export FRONTEND_HOST_PORT=0

                        docker compose \
                          --project-name "${CI_PROJECT:-hr-portal-ci-$BUILD_NUMBER}" \
                          --file "$COMPOSE_FILE" \
                          down --volumes --remove-orphans || true
                    '''
                }
            }
        }

        stage('Publish Images') {
            when {
                expression {
                    env.SOURCE_BRANCH == 'main' || env.SOURCE_BRANCH == 'develop'
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

                        docker push "$FRONTEND_REF"
                        docker push "$BACKEND_REF"

                        docker tag "$FRONTEND_REF" "$FRONTEND_IMAGE:$SAFE_BRANCH-latest"
                        docker tag "$BACKEND_REF" "$BACKEND_IMAGE:$SAFE_BRANCH-latest"

                        docker push "$FRONTEND_IMAGE:$SAFE_BRANCH-latest"
                        docker push "$BACKEND_IMAGE:$SAFE_BRANCH-latest"

                        if [ "$SOURCE_BRANCH" = "main" ]; then
                            docker tag "$FRONTEND_REF" "$FRONTEND_IMAGE:latest"
                            docker tag "$BACKEND_REF" "$BACKEND_IMAGE:latest"

                            docker push "$FRONTEND_IMAGE:latest"
                            docker push "$BACKEND_IMAGE:latest"
                        fi
                    '''
                }
            }
        }

        stage('Deploy with Compose') {
            when {
                expression {
                    env.SOURCE_BRANCH == 'main'
                }
            }

            steps {
                script {
                    input(
                        message: "Deploy ${env.IMAGE_TAG}?",
                        ok: 'Deploy'
                    )
                }

                sh '''
                    export FRONTEND_REF BACKEND_REF
                    export DB_HOST_PORT=3307
                    export BACKEND_HOST_PORT=4000
                    export FRONTEND_HOST_PORT=4200

                    docker compose \
                      --project-name hr-portal-prod \
                      --file "$COMPOSE_FILE" \
                      up --detach --wait --no-build

                    docker compose \
                      --project-name hr-portal-prod \
                      --file "$COMPOSE_FILE" \
                      ps
                '''
            }
        }
    }

    post {
        success {
            echo "Pipeline succeeded for ${env.SOURCE_BRANCH}: ${env.IMAGE_TAG}"
        }

        failure {
            echo 'Pipeline failed. Check the failed stage logs.'
        }

        always {
            cleanWs()
        }
    }
}
