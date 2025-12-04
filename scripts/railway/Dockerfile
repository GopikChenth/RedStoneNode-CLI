FROM haproxy:2.8-alpine

# Install netcat for health checks
RUN apk add --no-cache netcat-openbsd

# Copy HAProxy config
COPY haproxy.cfg /usr/local/etc/haproxy/haproxy.cfg

# Expose Minecraft port
EXPOSE 25565

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD nc -z localhost 25565 || exit 1

CMD ["haproxy", "-f", "/usr/local/etc/haproxy/haproxy.cfg"]
