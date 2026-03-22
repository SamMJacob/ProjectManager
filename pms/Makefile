.PHONY: backend frontend both check migrate

backend:
	daphne -b 0.0.0.0 -p 8000 pms.asgi:application

frontend:
	cd frontend && npm run dev

both:
	$(MAKE) -j2 backend frontend

migrate:
	python manage.py migrate

check:
	python manage.py check
