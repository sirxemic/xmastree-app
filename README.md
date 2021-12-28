# Xmas Tree Lights App

Little app for live coding and exporting effects for [Matt Parker's Xmas tree
experiment (2021 edition)](https://www.youtube.com/watch?v=WuMRJf6B5Q4).

You can check this out online at https://sirxemic.github.io/xmastree-app/

## How to run locally

Make sure NodeJS is installed on your machine. Then it's as simple as:

```sh
npm install
npm run dev
```

It should now be accessible via http://localhost:3000/

## Using custom GIFT files

At the moment the app is "hardcoded" for a specific christmas tree. To make it
work with different trees, just replace `src/coords.gift` with the correct data.