# Bootcamp game catalog

## Setup

```sh-session
asdf install
yarn install
cp .env.sample .env
```

Put your Mongo Database URL in the `.env` file.

## Launch

```sh-session
yarn dev
```

## Populate DB

```sh-session
yarn populate-db
```

## Destroy DB

```sh-session
yarn destroy-db
```

## Tests

```sh-session
yarn test
```

## Linter

```sh-session
yarn lint
```
