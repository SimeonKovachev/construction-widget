FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files for layer-cached restore
COPY ConstructionWidget.sln .
COPY src/ConstructionWidget.Api/ConstructionWidget.Api.csproj             src/ConstructionWidget.Api/
COPY src/ConstructionWidget.Core/ConstructionWidget.Core.csproj           src/ConstructionWidget.Core/
COPY src/ConstructionWidget.Infrastructure/ConstructionWidget.Infrastructure.csproj src/ConstructionWidget.Infrastructure/
COPY src/ConstructionWidget.Application/ConstructionWidget.Application.csproj       src/ConstructionWidget.Application/

RUN dotnet restore

# Copy everything and publish
COPY . .
RUN dotnet publish src/ConstructionWidget.Api/ConstructionWidget.Api.csproj \
    -c Release -o /app/out --no-restore

# ── Runtime image ──────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/out .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "ConstructionWidget.Api.dll"]
