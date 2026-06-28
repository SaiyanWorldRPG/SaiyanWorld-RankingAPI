# update_ranking.rb
require "json"

file = "ranking.json"

ranking = JSON.parse(File.read(file))

ranking.sort_by! { |p| -p["score"].to_i }

File.write(file, JSON.pretty_generate(ranking))
