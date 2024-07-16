#!/bin/bash

# Get the directory of the current script
SCRIPT_DIR=$(dirname "$(realpath "$0")")

docker run \
    --name neo4j-uix \
    -p 7475:7475 -p 7688:7688 \
    -e NEO4J_apoc_export_file_enabled=true \
    -e NEO4J_apoc_import_file_enabled=true \
    -e NEO4J_apoc_import_file_use__neo4j__config=true \
    -e NEO4J_dbms_security_procedures_unrestricted=apoc.* \
    -e NEO4JLABS_PLUGINS='["apoc"]' \
    -e NEO4J_AUTH=neo4j/testpassword \
    -e NEO4J_dbms_connector_http_listen__address=:7475 \
    -e NEO4J_dbms_connector_bolt_listen__address=:7688 \
    -v ${SCRIPT_DIR}/neo4j/data:/data \
    -d \
    neo4j:latest