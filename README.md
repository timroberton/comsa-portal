# COMSA Portal

This is the repository for the COMSA Portal


## SETUP

#### Install Docker

In order to run the portal, you need to install Docker.

[https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)

Check that Docker is installed

```
docker --version
```

#### Pull the necessary Docker containers that are used by the portal

```
docker pull timroberton/comsa:odk
docker pull timroberton/comsa:timr
```

#### Copy git repo

```
git clone https://github.com/timroberton/comsa-portal.git <path/to/your/preferred/folder>
```

#### Run executable (binary)

```
cd <path/to/your/prefered/folder>
serve-win.exe
```

The portal should now be accessible at `http://localhost:9000`


## FILE STRUCTURE

#### File structure

```
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
        /<form_id>
            /_odkstorage
            /<data_file>
            /<data_file>
        /<form_id>
            /_odkstorage
            /<data_file>
            /<data_file>
        /<form_id>
            /_odkstorage
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
/temp
/serve-win.exe
```