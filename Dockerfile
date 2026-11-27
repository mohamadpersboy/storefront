# syntax=docker/dockerfile:1

# Docker Phase 1 — Next.js standalone image.
# Node 24 (Active/maintenance LTS line supported by Next 16.3 and Mongoose 9;
# package requirement: Node >=20.19). glibc (Debian) image is used because
# sharp ships prebuilt glibc binaries.
ARG NODE_IMAGE=node:24-bookworm-slim

# ── deps: install from lockfile only ──────────────────────────────
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ── builder ───────────────────────────────────────────────────────
FROM ${NODE_IMAGE} AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Public, non-secret build-time values. NEXT_PUBLIC_* is inlined into the
# client bundle at build time, so the real public values must be passed
# with --build-arg by CI. Defaults are harmless dummies.
ARG NEXT_PUBLIC_NESHAN_API_KEY=dummy-public-key
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000

# Dummy server-side values so `next build` can load src/config/env.ts.
# They exist only in this build stage (ENV here is not copied to the
# runner stage). No real secret is ever used or needed.
ENV NEXT_TELEMETRY_DISABLED=1 \
    DOCKER_BUILD=1 \
    NEXT_PUBLIC_NESHAN_API_KEY=${NEXT_PUBLIC_NESHAN_API_KEY} \
    NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL} \
    MONGODB_URI=mongodb://127.0.0.1:1/build_dummy \
    AUTH_SECRET=build-dummy-auth-secret-0000000000000000 \
    OTP_HASH_SECRET=build-dummy-otp-secret-00000000000000000 \
    CLOUDINARY_CLOUD_NAME=build-dummy \
    CLOUDINARY_API_KEY=build-dummy \
    CLOUDINARY_API_SECRET=build-dummy \
    SMS_IR_API_KEY=build-dummy \
    SMS_IR_LINE_NUMBER=build-dummy \
    SMS_IR_OTP_TEMPLATE_ID=build-dummy \
    ZARINPAL_MERCHANT_ID=build-dummy \
    ZARINPAL_MODE=sandbox
RUN npm run build

# ── runner ────────────────────────────────────────────────────────
FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    ISR_STRICT=1
# ISR_STRICT=1: runtime only (runner stage). A real MongoDB error during
# ISR regeneration is re-thrown, so Next.js keeps the last good page.
# The builder stage does not set it, so the build works without MongoDB.

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs --home-dir /app nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Writable path for ISR / Next.js cache (owned by the non-root user).
RUN mkdir -p /app/.next/cache && chown -R nextjs:nodejs /app/.next

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
