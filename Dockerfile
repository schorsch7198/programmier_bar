# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
COPY . /source
WORKDIR /source/programmier_bar.dbApiControllers

ARG TARGETARCH

# amd64 → x64 because .NET uses "x64" as its canonical arch name.
RUN --mount=type=cache,id=nuget,target=/root/.nuget/packages \
    dotnet publish -a ${TARGETARCH/amd64/x64} --use-current-runtime --self-contained false -o /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS final
WORKDIR /app
COPY --from=build /app .

USER $APP_UID
EXPOSE 80
ENTRYPOINT ["dotnet", "programmier_bar.dbApiControllers.dll"]