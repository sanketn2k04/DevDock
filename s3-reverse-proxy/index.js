const express=require('express')
const httpProxy=require('http-proxy')

const app=express();
const PORT=8000;

const BASE_PATH="https://s3.amazonaws.com/Bucket_name/__outputs";

const proxy=httpProxy.createProxy();

app.use((req,res)=>{
    const hostName=req.hostname;
    const subDomain=hostName.split('.')[0];
    // console.log(subDomain);
    const resolveTo=`${BASE_PATH}/${subDomain}`;
    // console.log(resolveTo);
    return proxy.web(req,res,{target:resolveTo,changeOrigin:true});

})

proxy.on('proxyReq', (proxyReq, req, res) => {
    const url = req.url;
    if (url === '/')
        proxyReq.path += 'index.html'

})

app.listen(PORT,()=>{
    console.log(`S3-reverse-proxy running on port no. ${PORT}`);
})