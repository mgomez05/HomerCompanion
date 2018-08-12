import json
from watson_developer_cloud import NaturalLanguageUnderstandingV1
from watson_developer_cloud.natural_language_understanding_v1 \
import Features, EntitiesOptions, KeywordsOptions

p = '"'

k = open("./story.txt", "r")
n = open("./keyword.txt", "w")

natural_language_understanding = NaturalLanguageUnderstandingV1(
  username='34cfc098-ba6a-4fa4-9d22-271463237fba',
  password='Rid12xL8hByH',
  version='2018-03-16')

response = natural_language_understanding.analyze(
  #text="It is far better to endure patiently a smart which nobody feels but yourself, than to commit a hasty action whose evil consequences will extend to all connected with you; and besides, the Bible bids us return good for evil.",
  text=k.read(),
  features=Features(
    entities=EntitiesOptions(
      #emotion=True,
      #sentiment=True,
      ),
    keywords=KeywordsOptions(
      #emotion=True,
      #sentiment=True,
      )))

print(json.dumps(response, indent=2))

listoftext = []

for i in range (0, max(len(response["keywords"]), len(response["entities"]))):
  try:
    k = json.dumps(response["keywords"][i]['text'])
    for char in p:
      k = k.replace(char, "")


    #n.writelines(k)
    listoftext.append(k)

    m = json.dumps(response["entities"][i]['text'])
    for char in p:
      m = m.replace(char, "")
    #n.writelines(m)
    listoftext.append(m)


  except IndexError:
    continue

stringoftext = ",".join(listoftext)
print(stringoftext)
n.writelines(stringoftext)

file.close
