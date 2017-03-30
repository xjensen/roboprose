MATCH
(parent), (user:User)
WHERE
parent.id = {parent_id} AND user.id = {user_id}
WITH parent, user
LIMIT 1
OPTIONAL MATCH (parent)-[:in_Chapter]->(possible_chapter)
WITH user, parent,
CASE
	WHEN 'Chapter' IN labels(parent) THEN parent
	ELSE possible_chapter
END as chapter
CREATE
(parent)
-[branch:Branch]->
(paragraph:Paragraph {
	id: {id_1},
	content: {content},
	position: (parent.position + 1),
	char_count: {char_count},
	timestamp: {timestamp}
})
<-[:Author]-
user,
(chapter)
<-[:in_Chapter]-
(paragraph)
WITH parent, paragraph, user, branch
OPTIONAL MATCH
(parent)-[:Branch]->(sibling)
RETURN
filter(x IN collect(DISTINCT sibling.id) WHERE NOT x = paragraph.id) as siblings,
parent.id as parent_id,
labels(paragraph) as labels,
paragraph.position as position,
paragraph.char_count as char_count,
paragraph.content as content,
paragraph.id as id,
paragraph.timestamp as timestamp,
user.name as user_name,
user.id as user_id
