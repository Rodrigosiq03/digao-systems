FROM eclipse-temurin:21-jre

WORKDIR /app

# The pipeline writes target/app.jar before build.
COPY target/app.jar /app/app.jar

EXPOSE 8082

ENV JAVA_OPTS=""

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
