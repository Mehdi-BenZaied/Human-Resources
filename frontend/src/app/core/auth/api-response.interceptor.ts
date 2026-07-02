import { HttpInterceptorFn } from '@angular/common/http';
import { map } from 'rxjs/operators';

/**
 * Unwraps the backend envelope `{ status, data, ... }` so every service
 * receives the inner `data` value directly.  Auth responses keep their full
 * shape because the auth service reads `session.token` / `session.user`.
 */
export const apiResponseInterceptor: HttpInterceptorFn = (request, next) => {
  return next(request).pipe(
    map((event: any) => {
      if (!event?.body || typeof event.body !== 'object') return event;

      const isAuthEndpoint = request.url.includes('/api/auth/');

      // FastAPI wraps responses as { message, data: { ... } }
      const body = 'data' in event.body ? event.body.data : event.body;

      if (isAuthEndpoint) {
        // FastAPI returns { access_token, token_type, user }
        // Frontend AuthService expects { token, user }
        const normalized = body?.access_token
          ? { token: body.access_token, user: body.user }
          : body;
        return event.clone({ body: normalized });
      }

      // All other endpoints: return unwrapped data
      return event.clone({ body: body });
    }),
  );
};
