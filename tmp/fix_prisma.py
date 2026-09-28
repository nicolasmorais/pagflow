paths = ['/opt/pagflow/prisma/schema.prisma', '/opt/pagflow/hermes-agent-mcp/schema.prisma']
for path in paths:
    with open(path) as f:
        lines = f.readlines()
    new_lines = []
    for line in lines:
        new_lines.append(line)
        if 'provider = "postgresql"' in line:
            new_lines.append('  url      = env("DATABASE_URL")\n')
    with open(path, 'w') as f:
        f.writelines(new_lines)
    print(f'Fixed: {path}')
