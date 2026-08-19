COMPOSE = docker compose --env-file .env -f docker/docker-compose.yaml
VERSION = $(shell tr -d '[:space:]' < VERSION)
export APP_VERSION = $(VERSION)

.PHONY: version config up down logs build test

version:
	@echo "Rumluos version: $(VERSION)"

config:
	$(COMPOSE) config

build:
	$(COMPOSE) build

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f --tail=100

test:
	cd rumluos && ./gradlew test
	cd rumluos-dashboard && npm run typecheck
