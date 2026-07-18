require "json"
require "net/http"
require "uri"

API_URL = "https://saiyanworld-rankingapi-production.up.railway.app/api/ranking"
FILE = "ranking.json"

# Baixa o ranking da API
uri = URI(API_URL)
response = Net::HTTP.get(uri)
data = JSON.parse(response)

# API retorna: { "players": { "id": {...}, ... } }
players_hash = data["players"] || {}

# Converte hash → array para ordenar
players_array = players_hash.values

# Ordena por score
players_array.sort_by! { |p| -p["score"].to_i }

# Limita a 15
players_array = players_array.first(15)

# Reconstrói o formato correto
new_players_hash = {}
players_array.each do |player|
  new_players_hash[player["player_id"]] = player
end

# Salva no ranking.json no formato correto
File.write(FILE, JSON.pretty_generate({ "players" => new_players_hash }))

puts "Ranking atualizado com sucesso!"
