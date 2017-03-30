MATCH
(parent), (user:User)
WHERE
parent.id = {parent_id} AND user.id = {user_id}
WITH parent, user
LIMIT 1
CREATE
(parent)
-[branch:Branch]->
(chapter:Chapter {
	title: {title},
	content: {content},
	position: (parent.position + 1),
	char_count: {char_count},
	id: {id_1},
	timestamp: {timestamp}
})
<-[u:Author]-
user
WITH parent, user, chapter, branch
OPTIONAL MATCH (parent)-[:in_Chapter]->(possible_previous_chapter)
WITH
parent, user, chapter, branch,
CASE
	WHEN 'Chapter' in labels(parent) THEN parent
	ELSE possible_previous_chapter
END as previous_chapter
MATCH
(book)<-[:in_Book]-(previous_chapter)
WITH parent, book, user, chapter, branch, previous_chapter
CREATE
(previous_chapter)
<-[:previous_Chapter]-
(chapter),
(book)
<-[:in_Book]-
(chapter)
WITH parent, chapter, user, previous_chapter, branch
SET chapter.number = (previous_chapter.number + 1)
WITH parent, chapter, user, branch
OPTIONAL MATCH
(parent)-[:Branch]->(sibling)
RETURN
filter(x IN collect(DISTINCT sibling.id) WHERE NOT x = chapter.id) as siblings,
parent.id as parent_id,
labels(chapter) as labels,
chapter.title as title,
chapter.number as number,
chapter.id as id,
chapter.position as position,
chapter.char_count as char_count,
chapter.content as content,
chapter.timestamp as timestamp,
user.name as user_name,
user.id as user_id
