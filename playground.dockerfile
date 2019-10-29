# multi-stage build of the zkstrata-playground

# setup bulletproofs_gadgets
FROM rust:1.38-slim
WORKDIR /bulletproofs
ADD bulletproofs_gadgets bulletproofs_gadgets
WORKDIR /bulletproofs/bulletproofs_gadgets
RUN rustup install nightly-2019-10-26
RUN cargo +nightly-2019-10-26 build --bins --quiet

# setup zkstratac
FROM maven:3.6.2-jdk-11-slim
WORKDIR /zkstratac
ADD zkStrata . 
RUN mvn --quiet package

# setup playground nodejs server
FROM node:8.16.2
WORKDIR /playground/node
COPY --from=0 /bulletproofs/bulletproofs_gadgets/target/debug/prover .
COPY --from=0 /bulletproofs/bulletproofs_gadgets/target/debug/verifier .
COPY --from=1 /zkstratac/target/zkstratac.jar .
COPY package.json package-lock.json index.html app.js ./
RUN npm install
RUN wget --quiet https://download.java.net/java/ga/jdk11/openjdk-11_linux-x64_bin.tar.gz
RUN tar xf openjdk-11_linux-x64_bin.tar.gz
CMD [ "npm", "start" ]