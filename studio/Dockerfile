FROM oven/bun:latest

WORKDIR /app

COPY package.json bun.lock* ./

RUN bun install

COPY . .

EXPOSE 3334

CMD ["bun", "run", "sanity", "dev", "--host", "0.0.0.0"]
