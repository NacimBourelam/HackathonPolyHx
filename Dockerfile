FROM golang:1.21

WORKDIR /app
COPY ./golang-server/go.sum ./golang-server/go.mod ./
RUN go mod download
COPY ./golang-server/*.go ./
ENV CGO_ENABLED=0
ENV GOOS=linux
RUN go build -o /docker-gs-ping
EXPOSE 3000
CMD ["/docker-gs-ping"]