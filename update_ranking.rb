require "json"

# Caminho do arquivo de ranking
file = "ranking.json"

# Se o arquivo não existir, cria um ranking inicial
unless File.exist?(file)
  File.write(file, JSON.pretty_generate([{ "name" => "Paulo", "score" => 0 }]))
end

# Carrega o ranking
ranking = JSON.parse(File.read(file))

# Remove entradas inválidas
ranking = ranking.select do |entry|
  entry.is_a?(Hash) &&
  entry["name"] &&
  entry["score"]
end

# Converte score para número
ranking.each do |player|
  player["score"] = player["score"].to_i
end

# Ordena por score (maior primeiro)
ranking.sort_by! { |p| -p["score"] }

# Limita a 15 jogadores (opcional)
ranking = ranking.first(15)

# Salva formatado
File.write(file, JSON.pretty_generate(ranking))

puts "Ranking atualizado com sucesso!"
