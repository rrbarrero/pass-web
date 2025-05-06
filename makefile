test_be:
	uv run pytest --cov-report term-missing --cov=src tests 

test_fe:
	cd frontend && npm run test && cd ..

up:
	docker-compose up backend frontend -d && docker-compose logs -f

dev:
	docker-compose up backend frontend-dev -d && docker-compose logs -f
