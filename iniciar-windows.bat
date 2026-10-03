@echo off
cd /d "%~dp0"
echo Instale Node.js 18+ se ainda nao tiver.
if not exist .env copy .env.example .env
echo Edite o arquivo .env com suas credenciais Shopee.
npm start
pause
