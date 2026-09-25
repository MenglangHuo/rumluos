FROM eclipse-temurin:25-jdk AS build
WORKDIR /workspace
ARG APP_VERSION=0.1.0
ENV APP_VERSION=${APP_VERSION}
COPY gradle/ gradle/
COPY gradlew settings.gradle build.gradle ./
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon
COPY src src
RUN ./gradlew bootJar --no-daemon -x test

FROM eclipse-temurin:25-jre
WORKDIR /app
RUN mkdir -p /app/uploads && useradd --system --uid 10001 rumluos
COPY --from=build /workspace/build/libs/*.jar /app/app.jar
RUN chown -R rumluos:rumluos /app
USER rumluos
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
