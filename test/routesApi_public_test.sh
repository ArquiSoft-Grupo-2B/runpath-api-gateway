#!/bin/bash
echo -e "== Routes API Public Test ==\n"

echo -e "\n1. Get all routes GET /routes\n"

ALL_ROUTES_RESPONSE=$(curl -X GET http://localhost:8888/routesApi/routes)

echo -e "Response:\n$ALL_ROUTES_RESPONSE\n"

ALL_ROUTES_RESPONSE_OG=$(curl -X GET http://localhost:3000/routes)

echo -e "Original Service Response:\n$ALL_ROUTES_RESPONSE_OG\n"