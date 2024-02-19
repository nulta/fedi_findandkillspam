FROM debian:bookworm-slim

RUN mkdir -p /opt/fedi-killspam
VOLUME /config
WORKDIR /opt/fedi-killspam


RUN apt-get update && apt-get install -y curl unzip

COPY . /opt/fedi-killspam/
RUN ln -s /config/config.json /opt/fedi-killspam/config.json


RUN curl -fsSL https://deno.land/install.sh | sh

CMD ["/root/.deno/bin/deno", "run", \
 "--allow-net", \
 "--allow-env=INTERCEPTOR_EXIT_ON_NEW_VERSION", \
 "local.ts"]
