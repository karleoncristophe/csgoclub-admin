import { useState } from 'react'
import {
  Avatar,
  Button,
  Card,
  Checkbox,
  Chip,
  Input,
  InputOTP,
  Label,
  ListBox,
  ListBoxItem,
  Select,
  Slider,
  Switch,
  Table,
  Tabs,
  TextField,
} from '@heroui/react'
import { StatusPill, TextBadge } from '@/components/StatusPill'

export function ThemeComponentsLab() {
  const [state, setState] = useState('sao-paulo')
  const [price, setPrice] = useState(180)

  return (
    <div className="space-y-4">
      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
        <TextField>
          <Label>E-mail</Label>
          <Input defaultValue="ops@cs2club.com" placeholder="voce@cs2club.com" />
        </TextField>
        <Select
          aria-label="Estado"
          selectedKey={state}
          onSelectionChange={(key) => {
            if (key != null) setState(String(key))
          }}
        >
          <Label>Estado</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {[
                ['São Paulo', 'sao-paulo'],
                ['Rio de Janeiro', 'rio-de-janeiro'],
                ['Minas Gerais', 'minas-gerais'],
                ['Paraná', 'parana'],
                ['Santa Catarina', 'santa-catarina'],
              ].map(([label, id]) => (
                <ListBoxItem key={id} id={id} textValue={label}>
                  {label}
                  <ListBoxItem.Indicator />
                </ListBoxItem>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
        <Card className="gap-4 p-4">
          <Switch defaultSelected>
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              Live drops
            </Switch.Content>
          </Switch>
          <Slider
            className="w-full"
            maxValue={500}
            minValue={0}
            value={price}
            onChange={(value) => setPrice(Array.isArray(value) ? value[0] : value)}
          >
            <Label>Preço</Label>
            <Slider.Output />
            <Slider.Track>
              <Slider.Fill />
              <Slider.Thumb />
            </Slider.Track>
          </Slider>
        </Card>

        <Card className="gap-4 p-4">
          <div className="flex flex-wrap gap-2">
            <Avatar>
              <Avatar.Fallback>KC</Avatar.Fallback>
            </Avatar>
            <Avatar>
              <Avatar.Fallback>AS</Avatar.Fallback>
            </Avatar>
            <Avatar>
              <Avatar.Fallback>BL</Avatar.Fallback>
            </Avatar>
          </div>
          <InputOTP className="max-w-full" defaultValue="1842" maxLength={4}>
            <InputOTP.Group>
              <InputOTP.Slot index={0} />
              <InputOTP.Slot index={1} />
              <InputOTP.Slot index={2} />
              <InputOTP.Slot index={3} />
            </InputOTP.Group>
          </InputOTP>
          <div className="flex flex-wrap gap-2">
            <Button>Click me</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="danger-soft">Danger soft</Button>
          </div>
        </Card>

        <Card className="p-0">
          <Card.Header className="px-4 pt-4">
            <Card.Title>Criar conta</Card.Title>
            <Card.Description>Checkout do jogador com os tokens atuais.</Card.Description>
          </Card.Header>
          <Card.Content className="flex flex-col gap-3 px-4">
            <TextField>
              <Label>Nome</Label>
              <Input placeholder="Karleon Cristophe" />
            </TextField>
            <Checkbox defaultSelected>
              <Checkbox.Content>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                Receber avisos
              </Checkbox.Content>
            </Checkbox>
          </Card.Content>
          <Card.Footer className="justify-end gap-2 px-4 pb-4">
            <Button size="sm" variant="tertiary">
              Steam
            </Button>
            <Button size="sm">Continuar</Button>
          </Card.Footer>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <Avatar.Fallback>C2</Avatar.Fallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-foreground">CS2Club Ops</p>
              <p className="text-xs text-muted">1.284 jogadores · 86 caixas</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Chip color="accent" size="sm">
              Accent
            </Chip>
            <Chip size="sm" variant="soft">
              Soft
            </Chip>
            <Chip color="success" size="sm">
              Success
            </Chip>
            <Chip color="warning" size="sm">
              Warning
            </Chip>
            <Chip color="danger" size="sm">
              Danger
            </Chip>
            <Chip color="success" size="sm" variant="soft">
              Success
            </Chip>
            <Chip color="warning" size="sm" variant="soft">
              Warning
            </Chip>
            <Chip color="danger" size="sm" variant="soft">
              Danger
            </Chip>
            <StatusPill active />
            <StatusPill active={false} />
            <TextBadge>Admin</TextBadge>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-medium text-foreground">Alterações não salvas</p>
          <p className="mt-1 text-sm text-muted">
            Descartar o tema atual volta para o preset CS2Club.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button size="sm" variant="tertiary">
              Discard
            </Button>
            <Button size="sm">Save changes</Button>
          </div>
        </Card>

        <Card className="p-2">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-default"
          >
            Nova caixa
            <kbd className="text-[10px] text-muted">N</kbd>
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-default"
          >
            Editar skin
            <kbd className="text-[10px] text-muted">E</kbd>
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger-soft"
          >
            Delete file
            <kbd className="text-[10px]">⌫</kbd>
          </button>
        </Card>

        <Card className="min-w-0 overflow-hidden md:col-span-2">
          <Table variant="primary">
            <Table.ScrollContainer>
              <Table.Content>
                <Table.Header>
                  <Table.Column isRowHeader>Abertura</Table.Column>
                  <Table.Column>Jogador</Table.Column>
                  <Table.Column>Status</Table.Column>
                  <Table.Column>Valor</Table.Column>
                </Table.Header>
                <Table.Body>
                  <Table.Row id="t1">
                    <Table.Cell className="font-mono text-xs">CS-10482</Table.Cell>
                    <Table.Cell>Ana Souza</Table.Cell>
                    <Table.Cell>
                      <StatusPill active />
                    </Table.Cell>
                    <Table.Cell>R$ 180,00</Table.Cell>
                  </Table.Row>
                  <Table.Row id="t2">
                    <Table.Cell className="font-mono text-xs">CS-10483</Table.Cell>
                    <Table.Cell>Bruno Lima</Table.Cell>
                    <Table.Cell>
                      <StatusPill active={false} />
                    </Table.Cell>
                    <Table.Cell>R$ 90,00</Table.Cell>
                  </Table.Row>
                  <Table.Row id="t3">
                    <Table.Cell className="font-mono text-xs">CS-10484</Table.Cell>
                    <Table.Cell>Carla Nunes</Table.Cell>
                    <Table.Cell>
                      <TextBadge>Pendente</TextBadge>
                    </Table.Cell>
                    <Table.Cell>R$ 240,00</Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Card>

        <Card className="p-4">
          <Tabs defaultSelectedKey="opens">
            <Tabs.ListContainer>
              <Tabs.List aria-label="Seções">
                <Tabs.Tab id="opens">
                  Aberturas
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="cases">
                  Caixas
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="analytics">
                  Analytics
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
          <p className="mt-4 text-sm text-muted">
            Labels, select e tabela usam os mesmos tokens do admin.
          </p>
        </Card>
      </div>
    </div>
  )
}
