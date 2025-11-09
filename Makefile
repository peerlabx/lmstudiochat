## This makefile will run Ollama models
.PHONY: help

##@ GENERAL

help: ## Makefile help
	@./builder/generate_help $(MAKEFILE_LIST)

##@ COMMANDS
install: ## Install dependancies
	npm install

run: ## Run as dev
	npm run dev
	
runweb: ## Run in browser
	npm run web



