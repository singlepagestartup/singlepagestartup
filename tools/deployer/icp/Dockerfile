FROM node:26.13.0-trixie

WORKDIR /usr/src/app

RUN curl -fsSL https://internetcomputer.org/install.sh -o /tmp/install-dfx.sh && \
    DFXVM_INIT_YES=1 sh /tmp/install-dfx.sh && \
    rm /tmp/install-dfx.sh

ENV PATH="/root/.local/share/dfx/bin:${PATH}"

RUN ["dfx", "--version"]
ENTRYPOINT ["dfx", "start", "--clean"]
# CMD ["tail", "-f", "/dev/null"]
