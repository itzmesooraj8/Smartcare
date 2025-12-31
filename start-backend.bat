docker-compose -f docker-compose.backend.yml up -d --build
echo "Backend running at http://localhost:8000"
echo "To view logs: docker-compose -f docker-compose.backend.yml logs -f"
