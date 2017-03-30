MATCH (user:User)
WHERE user.id = {user_id}
WITH user
LIMIT 1
CREATE
(book:Book {
	title: {book_title},
	id: {id_1},
	timestamp: {timestamp}
})
-[branch:Branch]->
(chapter:Chapter {
	title: {chapter_title},
	number: 1,
	content: {content},
	position: 1,
	char_count: {char_count},
	id: {id_2},
	locked: true,
	timestamp: {timestamp}
}),
(book)
<-[:in_Book]-
(chapter)
<-[u:Author]-
user
RETURN
book.title as book_title,
book.id as book_id,
labels(chapter) as labels,
chapter.title as title,
chapter.number as number,
chapter.locked as locked,
chapter.id as id,
chapter.position as position,
chapter.char_count as char_count,
chapter.content as content,
chapter.timestamp as timestamp,
user.name as user_name,
user.id as user_id
