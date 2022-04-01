![Banner](https://i.postimg.cc/XJ9fTqnZ/Fastify-API-Banner-Banner.png)

## 🚀 **Features**

- Authorization
- Swagger Docs
- Validation
- Dockerized
- Typesafe (Typescript)
- PM2 For multinstance launch

## 🛠️ **Tech Stack**

- Typescript
- Nodejs
- Fastify
- Zod
- Docker
- PM2
- Swagger
- JWT
- PostgresSQL

## 👷‍♂️ **Local Development**

Start developing locally.

Before you get started make sure you have `docker` and `docker-compose` installed

### *Step-1*

clone this repo

```sh
https://github.com/ayushpaharia/Fastify-API
```

### *Step-2*

Install all dependencies

```sh
# install server side deps
cd Fasitify-API
npm install
# or yarn install
```

### *Step-3*

Environment variables

_Now this is a bit tricky._

- create a new file .env in the root folder
- open [.env.EXAMPLE](./.env.EXAMPLE)
- copy the contents and paste it to the .env

And change all the dummy keys with your own valid ones.

#### Step-4: Starting the server

Finally to start the server execute this script

```sh
npm run develop
```

#### All Package.json scripts


  **start** - starts server with ts-node\
  **build** - transpiles code with tsc in watch mode\
  **pm2:startone** - starts one instance of app with pm2\
  **pm2:start** - start all instances available with pm2\
  **pm2:dev** - transpiles and runs from ts code\
  **pm2:kill** - kill all pm2 server instances\
  **serve** - transpiles and runs from js code\
  **dev:1** - starts server with ts-node-dev\
  **dev:2** - starts server with nodemon\

---

### Pushing the changes

```bash
git add .
git commit -m "feat: added new stuff"
git push YOUR_REPO_URL BRANCH_NAME
```

---

Made with ❤️ and javascript 💻 by [Ayush Paharia]()
