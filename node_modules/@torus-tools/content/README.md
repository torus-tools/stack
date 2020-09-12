# Torus Tools - Content
A promise-based javascript SDK that facilitates operations related to content stored in AWS S3 as well as cache invalidations in AWS cloudfront.

## Operations
- list
- download
- upload
- delete


## Currently Supporting
- AWS

## Features
- Option to only upload files that have been updated
- Automatically update cache in cloudfront for updated files that already exist
- provides a single method that deletes all of the content in a particular bucket
- Automatically creates nonexistent directories for downloaded files 


# Getting started
## Installation
```
npm i @torus-tools/content
```

## Usage
The example bellow publishes updated content to s3 and creates an invalidation in cloudfront for the updated assets.
```
const {listFiles, uploadContent} = require('@torus-tools/content')

let files = await ListFiles().catch(err=> console.log(err))
await uploadContent('yoursite.com', files, true, true).catch(err => console.log(err))
```

# API
## listContent (domain)
- **description**: Lists all the objects from the S3 bucket of the specified domain.
- **params**: (domain)
  - **domain**: STRING: REQUIRED: The domain of your site or bucket (i.e. yoursite.com).
- **returns**: promise(resolve, reject)
  - **resolve**: An array of objects that contain the properties for all of the objects in the given bucket.
  - **reject**: (error)

## listFiles (root, path)
- **description**: Gets the file paths for all of the files in the given directory.
- **params**: (domain)
  - **root**: Root directory for the files that you want to upload. Default is the current working directory.
  - **path**: Path of a directory for which you want to retrieve files.
- **returns**: promise(resolve, reject)
  - **resolve**: An array of strings that contains all of the file paths.
  - **reject**: (error)

## downloadContent(domain, output, files, cli)
- **description**: downloads content from a given bucket to a local output_path specified. By default it will download all files and create/overwrite content in the current working directory. When provided the files parameter, it will only download the given files.
- **params**: (domain, output, files, cli)
  - **domain**: STRING: REQUIRED: the domain of your site i.e. yoursite.com you want to download files from
  - **output**: STRING: Desired output directory path to save the downloaded files. By default its the current working directory.
  - **files**: ARRAY: The file paths, or key names, that uniquely identifies the objects stored in the bucket. If none are provided, it downloads all of the objects.
  - **cli**: OBJECT: Recieves the cli object from oclif.
- **returns**: promise(resolve, reject)
  - **resolve**: ('All done!')
  - **reject**: (error)

## uploadContent (domain, files, purge, updates, dir, cli)
- **description**: Uploads content to the bucket of the given domain. If the updates param is provided it will only upload files that were modified after their last upload. When the purge param is provided it will also create a CloudFront invalidation for any updated files that were already chached.
- **params**: (domain, files, resetCache, cli)
  - **domain**: STRING: REQUIRED: the domain of your site i.e. yoursite.com you want to upload updated files to
  - **files**: ARRAY: REQUIRED: The file paths that you want to upload.
  - **purge**: BOOLEAN: creates an invalidation in the cloudfront distribution for the given files.
  - **updates**: BOOLEAN: set to true if you only want to publish files that were updated.
  - **dir**: STRING: Root directory that you want to upload. By default its the current working directory.
  - **cli**: OBJECT: Recieves the cli object from oclif.
- **returns**: promise(resolve, reject)
  - **resolve**: ('All done')
  - **reject**: (error)

## deleteContent(domain, files)
- **description**: Deletes content in a bucket belonging to a domain. If files are provided it will only delete those specific files. By default it deletes all of the files.
- **params**: (domain, files)
  - **domain**: STRING: REQUIRED: the root domain of your site i.e. yoursite.com
  - **files**: ARRAY: REQUIRED: The file paths, or key names, that uniquely identifies the objects you want to delete. If none are provided, it deletes all of the objects.
- **returns**: promise(resolve, reject)
  - **resolve**: ('All done')
  - **reject**: (error)

## invalidateCache (domain, files)
- **description**: Creates an invalidation in the cloudfront distribution for the given domain.
- **params**: (domain, files)
  - **domain**: STRING: REQUIRED: the root domain of the site i.e. yoursite.com
  - **files**: ARRAY: REQUIRED: The routes or file paths that you want to purge from cache.
- **returns**: promise(resolve, reject)
  - **resolve**: ('all done!')
  - **reject**: (error)