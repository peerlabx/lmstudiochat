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

checkdevices: ## Check connected Android devices
	adb devices

runandroid: ## Run on Android device Press a
	npx expo start --localhost

reversetcp: ## Run this command to fix Expo
	adb reverse tcp:8081 tcp:8081

installapp: ## Install a built .apk
	adb install /home/decentfuture/Cloud/GitHub/peerlabx/lmchat_v1.12/android/app/build/outputs/apk/release/app-release.apk

buildapk: ## Build the apk /android/app/build/outputs/apk/release/app-release.apk
	npm run build:android && cd android && ./gradlew assembleRelease

removebuild: ## Start over
	rm -rf node_modules && rm package-lock.json && npm install

clearit: ## CLear build
	cd android && ./gradlew clean



