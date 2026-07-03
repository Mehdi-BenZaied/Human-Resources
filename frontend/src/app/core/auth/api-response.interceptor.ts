import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';

/**
 * Normalises FastAPI response shapes so every service receives plain data:
 *
 *  - POST /api/auth/login|signup → { message, data: { access_token, user } }
 *      becomes → { token, user }
 *  - GET  /api/auth/me          → UserOut (already flat, untouched)
 *  - All other endpoints        → plain array or object (already flat, untouched)
 *
 * The interceptor only touches HttpResponse bodies, never other event types.
 */
export const apiResponseInterceptor: HttpInterceptorFn = (request, next) => {
  return next(request).pipe(
    map(event => {
      // Only process completed HTTP responses, ignore Sent/Upload/Download events
      if (!(event instanceof HttpResponse)) return event;

      const body = event.body;

      // ── Auth login / signup ──────────────────────────────────────────────
      // Shape: { message: string, data: { access_token: string, token_type: string, user: {...} } }
      const isAuthLoginOrSignup =
        request.url.includes('/api/auth/login') ||
        request.url.includes('/api/auth/signup');

      if (isAuthLoginOrSignup && body && typeof body === 'object' && 'data' in (body as object)) {
        const data = (body as any).data;
        // Rename access_token → token to match AuthService.storeSession()
        const normalised = data?.access_token
          ? { token: data.access_token, user: data.user }
          : data;
        return event.clone({ body: normalised });
      }

      // All other endpoints return plain data already — no transformation needed
      return event;
    }),
  );
};
