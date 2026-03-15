FROM eclipse-temurin:21-jre

WORKDIR /app

# The CI pipeline stages app.jar into the minimal image context before build.
COPY app.jar /app/app.jar

EXPOSE 8082

ENV JAVA_OPTS=""

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
