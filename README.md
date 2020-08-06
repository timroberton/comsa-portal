# COMSA Portal

This is the repository for the COMSA Portal


## SETUP

#### Install Docker

In order to run the portal, you need to install Docker.

[https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)

#### Pull necessary Docker containers

```
docker pull timroberton/comsa:timr
docker pull timroberton/comsa:odk
```

#### Copy git repo

```
git clone https://github.com/timroberton/comsa-portal.git comsa-portal
```

#### Run executable (binary)

```
cd comsa-portal
serve-win.exe
```

The portal should now be accessible at `http://localhost:9000`


## FILE STRUCTURE

#### File structure

```
/users/username
        /serve-win.exe
        /admin
            /.odk.json
            /.users.json
        /analyses
            /<id>
                /.metadata.json
                /.script.R
                /<analysis_output_file>
                /<analysis_output_file>
                /<analysis_output_file>
            /<id>
                /.metadata.json
                /.script.R
                /<analysis_output_file>
                /<analysis_output_file>
                /<analysis_output_file>
            /<id>
                /.metadata.json
                /.script.do
                /<analysis_output_file>
                /<analysis_output_file>
                /<analysis_output_file>
        /data
            /odk
                /<data_file>
                /<data_file>
                /<data_file>
                /<data_file>
                /<data_file>
                /<data_file>
            /uploaded
                /<data_file>
                /<data_file>
                /<data_file>
        /exported
            /<analysis_output_file>
            /<analysis_output_file>
            /<analysis_output_file>
            /<analysis_output_file>
        /html
            /static
                /css
                /js
            /index.html
        /odkstorage
        /temp
```