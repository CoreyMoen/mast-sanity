FROM oven/bun:latest

WORKDIR /app

COPY package.json bun.lock* ./

RUN bun install

COPY . .

EXPOSE 3001

CMD ["bun", "run", "next", "dev", "--turbopack", "-p", "3001", "--hostname", "0.0.0.0"]
