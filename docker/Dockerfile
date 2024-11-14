FROM nginx

RUN apt-get update

RUN apt-get install git nano nodejs npm -y

WORKDIR /

RUN git clone https://github.com/humlab-sead/sead_data_quality_control_tool

WORKDIR /sead_data_quality_control_tool

RUN npm install

RUN npm run build

RUN cp -r dist/* /usr/share/nginx/html