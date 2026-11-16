# Lily likes dinosaurs and is not steered to dolls

Result: pass

**system**
The child tapped their wand. The child's name is Lily. Don't ask for it; greet them by name.

**assistant**
Oh! Hello Lily! I'm Aunty Bella. What's the best thing you've played with lately?
Tools: set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**kid**
I like dinosaurs and mud.

**assistant**
Would you like wooden dinosaur figures?
Tools: set_mood({"mood":"thinking"})

**kid**
Yeah!

**assistant**
Yes! Wooden dinosaur figures is going on your list. That's one. What else do you love doing?
Tools: add_to_wishlist({"item":"wooden dinosaur figures","reason":"You said you like dinosaurs."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 1 item. Aim for 5.

**kid**
I like blocks.

**assistant**
Would you like wooden building blocks you can build a castle with?
Tools: set_mood({"mood":"thinking"})

**kid**
Yeah!

**assistant**
Yes! Wooden building blocks is going on your list. That's two. What else do you love doing?
Tools: add_to_wishlist({"item":"wooden building blocks","reason":"You said you like blocks."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 2 items. Aim for 5.

**kid**
I like bugs.

**assistant**
Would you like a magnifying glass to look at bugs and leaves?
Tools: set_mood({"mood":"thinking"})

**kid**
Yeah!

**assistant**
Yes! Magnifying glass is going on your list. That's three. What else do you love doing?
Tools: add_to_wishlist({"item":"magnifying glass","reason":"You said you like looking closely."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 3 items. Aim for 5.

**kid**
I like books.

**assistant**
Would you like picture books to share?
Tools: set_mood({"mood":"thinking"})

**kid**
Yeah!

**assistant**
Yes! Picture books is going on your list. That's four. What else do you love doing?
Tools: add_to_wishlist({"item":"picture books","reason":"You said you like books."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 4 items. Aim for 5.

**kid**
I like drums.

**assistant**
Would you like a small drum you can tap?
Tools: set_mood({"mood":"thinking"})

**kid**
Yeah!

**assistant**
Yes! Small drum is going on your list. That's five. Lily, we did it! Five wonderful things are on your list. It's on its way to Mum. You were brilliant.
Tools: add_to_wishlist({"item":"small drum","reason":"You said you like music."}), set_mood({"mood":"happy"}), set_leds({"color":"rainbow"}), finish_session({"reason":"complete","detail":"five items"})

**system**
Wishlist now has 5 items. Do the happy recap and say the list is on its way to Mum.

**worker**
Emailed Mum only (wishlist, sent).
