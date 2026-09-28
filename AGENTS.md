# Reglas para colaborar con IA

1. No copies marca, logotipo ni textos de Duolingo; crea una identidad propia.
2. Revisa el banco de preguntas antes de programar: debe haber 20 preguntas y una respuesta correcta por cada una.
3. No cambies la respuesta correcta después de renderizar las opciones.
4. Bloquea las opciones después de que el usuario responda hasta presionar Continuar.
5. Mantén separados los datos, el estado del juego y la actualización del DOM.
6. Calcula el porcentaje con base en preguntas respondidas o el total establecido y muestra una etiqueta clara.
7. Prueba respuestas correctas, incorrectas, pérdida de vidas, final de 20 preguntas y reinicio.

## Nota sobre el alcance (fase 2)

Las reglas originales de este archivo (y del `README.md` inicial del
hackatón) decían explícitamente "sin backend, sin base de datos, sin
cuentas de usuario" — esa era la restricción del reto original de un solo
día, para forzar a resolver todo en el navegador.

El dueño del proyecto pidió después, explícitamente, ampliar el alcance:
login real con contraseña encriptada y persistencia del progreso en una
base de datos MySQL (ver `PLAN.md`, sección "Fase 2"). Esa ampliación ya
se implementó (carpeta `server/`, `docker-compose.yml`). Las reglas 1-7 de
arriba siguen aplicando al juego en sí; ya no aplica la restricción vieja
de "no backend / no base de datos / no cuentas de usuario".
