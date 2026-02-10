FROM node:20-alpine

WORKDIR /app

# Copiar solo lo necesario
COPY package*.json ./
COPY prisma ./prisma

# Instalar dependencias
RUN npm install

# Copiar el resto
COPY . .

# Compilar TS
RUN npm run build

# Puerto interno
EXPOSE 3000

# Prisma + app# Imagen base
FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Exponer puerto (Fastify usa 3000)
EXPOSE 3000

# Variables necesarias
ENV NODE_ENV=production

# Comando de arranque
CMD ["npm", "run", "dev"]

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/app.js"]
