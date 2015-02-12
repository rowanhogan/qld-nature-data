require 'sinatra'
require 'nokogiri'
require 'open-uri'
require 'json'
require 'pry'

base_api_url = "http://environment.ehp.qld.gov.au/species/?op="

get "/" do
  File.read(File.join('public', 'index.html'))
end

get '/api/:query' do
  data = JSON.parse(open("#{base_api_url}#{params[:query] if params[:query]}").read)
  data.to_json
end

get '/images/:query' do
  # url = "http://en.wikipedia.org/w/api.php?action=query&list=allimages&aiprop=url&format=json&ailimit=1$aisort=timestamp&aifrom=#{params[:query]}"
  url = "http://en.wikipedia.org/w/api.php?action=opensearch&limit=5&format=xml&namespace=0&search=#{params[:query]}"

  doc = Nokogiri::XML(open(url))
  image_url = doc.css('Image')[0].attributes['source'].value

  { url: image_url }.to_json
end

