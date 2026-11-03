FROM node:18

WORKDIR /usr/src/app

RUN sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"

RUN ["dfx", "stop"]
ENTRYPOINT ["dfx", "start", "--clean", "--emulator"]
# CMD ["tail", "-f", "/dev/null"]