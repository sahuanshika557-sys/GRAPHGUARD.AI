"""
Parameterized Cypher Queries for FalkorDB Investigation Operations.
"""

CYPHER_GET_TRANSACTION = """
MATCH (t:Transaction {id: $tx_id})
RETURN t
"""

CYPHER_GET_TRANSACTION_ACCOUNT = """
MATCH (a:Account)-[:MADE]->(t:Transaction {id: $tx_id})
RETURN a
"""

CYPHER_GET_CUSTOMER = """
MATCH (c:Customer)-[:OWNS]->(a:Account)-[:MADE]->(t:Transaction {id: $tx_id})
RETURN c
"""

CYPHER_GET_DEVICE = """
MATCH (t:Transaction {id: $tx_id})-[:USED_DEVICE]->(d:Device)
RETURN d
"""

CYPHER_GET_IP_LOCATION = """
MATCH (t:Transaction {id: $tx_id})-[:FROM_IP]->(ip:IP)-[:LOCATED_IN]->(loc:Location)
RETURN ip, loc
"""

CYPHER_GET_SHARED_DEVICES = """
MATCH (t:Transaction {id: $tx_id})-[:USED_DEVICE]->(d:Device)
OPTIONAL MATCH (d)-[:SHARED_WITH|ASSOCIATED_WITH]-(other_a:Account)
RETURN d, collect(other_a) AS connected_accounts
"""

CYPHER_GET_CONNECTED_ACCOUNTS = """
MATCH (t:Transaction {id: $tx_id})-[:USED_DEVICE]->(d:Device)-[:SHARED_WITH|ASSOCIATED_WITH]-(other_a:Account)
RETURN other_a, d
"""

CYPHER_GET_PREVIOUS_INCIDENTS = """
MATCH path = (t:Transaction {id: $tx_id})-[:USED_DEVICE]->(d:Device)-[:SHARED_WITH|ASSOCIATED_WITH*1..2]-(a:Account)-[:HAS_INCIDENT]->(inc:Incident)
RETURN inc, a, path
"""

CYPHER_GET_RELATED_TRANSACTIONS = """
MATCH (t:Transaction {id: $tx_id})<-[:MADE]-(a:Account)-[:MADE]->(other_t:Transaction)
WHERE other_t.id <> $tx_id
RETURN other_t
"""

CYPHER_MULTI_HOP_TRAVERSAL = """
MATCH path = (t:Transaction {id: $tx_id})-[*1..4]-(target)
WHERE target:Incident OR (target:Account AND target.status CONTAINS 'FROZEN') OR (target:Device AND target.is_rooted = true)
RETURN path
"""
