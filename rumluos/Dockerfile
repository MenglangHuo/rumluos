FROM eclipse-temurin:25-jdk-alpine AS build
WORKDIR /workspace
ARG APP_VERSION=0.1.0
ENV APP_VERSION=${APP_VERSION}
ENV GRADLE_OPTS="-Dorg.gradle.jvmargs='-Xmx512m -XX:MaxMetaspaceSize=256m'"
COPY gradle/ gradle/
COPY gradlew settings.gradle build.gradle ./
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon
COPY src src
RUN ./gradlew bootJar --no-daemon -x test

FROM eclipse-temurin:25-jre-alpine
WORKDIR /app
RUN mkdir -p /app/uploads && \
    addgroup -g 10001 -S rumluos && \
    adduser -u 10001 -S -G rumluos rumluos && \
    chown -R rumluos:rumluos /app
COPY --from=build --chown=rumluos:rumluos /workspace/build/libs/*.jar /app/app.jar
USER rumluos
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
