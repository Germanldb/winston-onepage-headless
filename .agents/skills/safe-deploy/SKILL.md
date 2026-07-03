---
name: "Safe Deploy / Bloqueo de Git Push"
description: "Se activa cada vez que se vaya a realizar un deploy, git push, o subir código a producción. Obliga al agente a pedir confirmación al usuario antes de ejecutar el comando."
---

# Reglas Estrictas de Despliegue Seguro

Cuando vayas a ejecutar un comando que involucre subir código a producción (como `git push origin main`, despliegues en Vercel, o similares), ESTÁS OBLIGADO a seguir este protocolo ANTES de ejecutar el comando:

1. **Verificar Autorización Explícita**: Verifica en el mensaje del usuario si ha escrito explícitamente la palabra **'deploy'** o **'commit a main y deploy'**. Si NO lo ha hecho, responde inmediatamente diciendo que tienes bloqueado el acceso a producción sin esa palabra y no ejecutes nada.
2. **Pedir Confirmación (Ask Question)**: Si el usuario sí usó la palabra 'deploy', detente y usa la herramienta `ask_question` para mostrarle un modal interactivo con el resumen de los commits que vas a hacer.
   - Pregunta: "¿Confirmas el pase a producción (git push) con los siguientes cambios?"
   - Opciones: "Sí, hacer deploy a main", "No, cancelar"
3. **Bloqueo Físico**: Solo podrás proceder a usar la herramienta `run_command` con `git push` si el usuario ha seleccionado la opción afirmativa en la pregunta interactiva.
