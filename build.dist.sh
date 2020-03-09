#!/bin/bash

./gradlew shadowJar

rm -rf dist
mkdir dist

cp build/libs/note_searcher2-1.0-SNAPSHOT-all.jar dist/note_searcher.jar

cat <<EOF >> dist/note_searcher.sh
#!/bin/bash

java -jar note_searcher.jar "\$@"
EOF
