FROM nginx

RUN apt-get update

RUN apt-get install git nano build-essential -y

# Add NodeSource repository for Node.js 22
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash -

# Install Node.js and npm
RUN apt-get install -y nodejs

WORKDIR /

ADD https://api.github.com/repos/humlab-sead/sead_data_quality_control_tool/git/refs/heads/master version.json

RUN git clone https://github.com/humlab-sead/sead_data_quality_control_tool

WORKDIR /sead_data_quality_control_tool

RUN npm install

RUN npm run build

RUN cp -r dist/* /usr/share/nginx/html