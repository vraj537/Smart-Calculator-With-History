#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

struct node
{
    char data[12];
    struct node *next;
};
struct node *front = NULL;
struct node *rear = NULL;

struct hnode
{
    int id;
    char expr[100];
    char post[200];
    int result;
    struct hnode *prev;
    struct hnode *next;
};
struct hnode *head = NULL;
struct hnode *tail = NULL;
struct hnode *current = NULL;
int counter = 0;

char token[12];
char stack[100];
int top = -1;
int vals[100];
int vtop = -1;
char posttext[300];
int result;

void enqueue(char data[])
{
    struct node *newnode = (struct node *)malloc(sizeof(struct node));
    strcpy(newnode->data, data);
    newnode->next = NULL;
    if(rear == NULL)
        front = newnode;
    else
        rear->next = newnode;
    rear = newnode;
}

void dequeue()
{
    struct node *temp = front;
    strcpy(token, temp->data);
    front = front->next;
    if(front == NULL)
        rear = NULL;
    free(temp);
}

void push(char c) { top++; stack[top] = c; }
char pop() { top--; return stack[top + 1]; }
void pushval(int v) { vtop++; vals[vtop] = v; }
int popval() { vtop--; return vals[vtop + 1]; }

int precedence(char op)
{
    if(op == '^') return 3;
    if(op == '*' || op == '/') return 2;
    if(op == '+' || op == '-') return 1;
    return 0;
}

void addpost(char t[])
{
    strcat(posttext, t);
    strcat(posttext, " ");
}

void addop(char c)
{
    char t[2] = {c, '\0'};
    addpost(t);
}
void step(char code[], char t[])
{
    int i;
    struct node *q;
    printf("STEP|%s|%s|", code, t);
    for(q = front; q != NULL; q = q->next)
        printf("%s ", q->data);
    printf("|");
    for(i = 0; i <= top; i++)
        printf("%c ", stack[i]);
    printf("|%s|", posttext);
    for(i = 0; i <= vtop; i++)
        printf("%d ", vals[i]);
    printf("\n");
}

int error(char msg[])
{
    printf("ERR|%s\n", msg);
    return 0;
}

void reset()
{
    while(front != NULL)
        dequeue();
    top = -1;
    vtop = -1;
    posttext[0] = '\0';
}

int maketokens(char expr[])
{
    int i = 0, n;
    char t[12];
    while(expr[i] != '\0')
    {
        if(isdigit(expr[i]))
        {
            for(n = 0; isdigit(expr[i]) && n < 10; n++, i++)
                t[n] = expr[i];
            t[n] = '\0';
            enqueue(t);
        }
        else if(strchr("+-*/^()", expr[i]) != NULL)
        {
            t[0] = expr[i];
            t[1] = '\0';
            enqueue(t);
            i++;
        }
        else if(expr[i] == ' ')
            i++;
        else
            return error("Invalid character");
    }
    if(front == NULL)
        return error("Empty expression");
    return 1;
}

int topostfix()
{
    char c;
    while(front != NULL)
    {
        dequeue();
        c = token[0];
        if(isdigit(c))
            addpost(token);
        else if(c == '(')
            push(c);
        else if(c == ')')
        {
            while(top != -1 && stack[top] != '(')
                addop(pop());
            if(top == -1)
                return error("Mismatched parentheses");
            pop();
        }
        else
        {
            while(top != -1 && precedence(stack[top]) >= precedence(c))
                addop(pop());
            push(c);
        }
        step("2", token);
    }
    while(top != -1)
    {
        c = pop();
        if(c == '(')
            return error("Mismatched parentheses");
        addop(c);
    }
    step("2e", "");
    return 1;
}

int evaluate()
{
    char copy[300];
    char *t;
    int a, b, r = 0;
    strcpy(copy, posttext);
    for(t = strtok(copy, " "); t != NULL; t = strtok(NULL, " "))
    {
        if(isdigit(t[0]))
            pushval(atoi(t));
        else
        {
            if(vtop < 1)
                return error("Invalid expression");
            b = popval();
            a = popval();
            if(t[0] == '+') r = a + b;
            if(t[0] == '-') r = a - b;
            if(t[0] == '*') r = a * b;
            if(t[0] == '^')
            {
                if(b < 0)
                    return error("Negative power not supported");
                for(r = 1; b > 0; b--)
                    r = r * a;
            }
            if(t[0] == '/')
            {
                if(b == 0)
                    return error("Division by zero");
                r = a / b;
            }
            pushval(r);
        }
        step("3", t);
    }
    if(vtop != 0)
        return error("Invalid expression");
    result = vals[0];
    return 1;
}

void addhistory(char expr[])
{
    struct hnode *newnode = (struct hnode *)malloc(sizeof(struct hnode));
    counter++;
    newnode->id = counter;
    strcpy(newnode->expr, expr);
    strcpy(newnode->post, posttext);
    newnode->result = result;
    newnode->next = NULL;
    newnode->prev = tail;
    if(head == NULL)
        head = newnode;
    else
        tail->next = newnode;
    tail = newnode;
    current = newnode;
}

void showhistory()
{
    struct hnode *t;
    for(t = head; t != NULL; t = t->next)
        printf("NODE|%d|%s|%s|%d\n", t->id, t->expr, t->post, t->result);
    if(current == NULL)
        printf("CUR|0\n");
    else
        printf("CUR|%d\n", current->id);
}

void goprev()
{
    if(current != NULL && current->prev != NULL)
        current = current->prev;
}

void gonext()
{
    if(current != NULL && current->next != NULL)
        current = current->next;
}

void clearhistory()
{
    struct hnode *t;
    while(head != NULL)
    {
        t = head;
        head = head->next;
        free(t);
    }
    tail = NULL;
    current = NULL;
}

void calculate(char expr[])
{
    reset();
    if(strlen(expr) > 90)
    {
        error("Expression too long");
        return;
    }
    if(!maketokens(expr))
        return;
    step("1", "");
    if(!topostfix())
        return;
    if(!evaluate())
        return;
    addhistory(expr);
    step("4", "");
    printf("OK|%d\n", result);
}

int main()
{
    char line[200];
    int n;
    while(fgets(line, 200, stdin) != NULL)
    {
        n = strlen(line);
        while(n > 0 && (line[n - 1] == '\n' || line[n - 1] == '\r'))
            line[--n] = '\0';
        if(strncmp(line, "CALC ", 5) == 0)
            calculate(line + 5);
        else if(strcmp(line, "PREV") == 0)
        {
            goprev();
            showhistory();
        }
        else if(strcmp(line, "NEXT") == 0)
        {
            gonext();
            showhistory();
        }
        else if(strcmp(line, "CLEAR") == 0)
        {
            clearhistory();
            showhistory();
        }
        else
            showhistory();
        printf("END\n");
        fflush(stdout);
    }
    return 0;
}
